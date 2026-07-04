import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CulqiChargeRequest, CulqiService } from './culqi.service';

describe('CulqiService', () => {
  const chargeRequest: CulqiChargeRequest = {
    amount: 12990,
    currency_code: 'PEN',
    email: 'customer@example.com',
    source_id: 'tkn_test_example',
    antifraud_details: {
      first_name: 'Mila',
      last_name: 'Raffo',
      device_finger_print_id: 'device-id',
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a charge with the configured secret key', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'chr_test_example' }), {
        status: 200,
      }),
    );
    const service = createService();

    await expect(service.createCharge(chargeRequest)).resolves.toEqual({
      charge: { id: 'chr_test_example' },
      requires3DS: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.culqi.com/v2/charges');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      Authorization: 'Bearer sk_test_example',
      'Content-Type': 'application/json',
    });
  });

  it('reports a 201 response as requiring 3DS', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ object: 'error' }), { status: 201 }),
      );

    await expect(createService().createCharge(chargeRequest)).resolves.toEqual({
      charge: { object: 'error' },
      requires3DS: true,
    });
  });

  it('returns a safe provider error for a rejected charge', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          user_message: 'La tarjeta fue rechazada',
          outcome: { code: 'card_declined' },
        }),
        { status: 400 },
      ),
    );

    await expect(
      createService().createCharge(chargeRequest),
    ).rejects.toMatchObject({
      response: {
        message: 'La tarjeta fue rechazada',
        providerCode: 'card_declined',
      },
    });
  });

  it('fails without making a request when the secret key is missing', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    fetchMock.mockClear();
    const service = createService('');

    await expect(service.createCharge(chargeRequest)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid provider response', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('not-json', { status: 502 }));

    await expect(
      createService().createCharge(chargeRequest),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});

function createService(secretKey: string | undefined = 'sk_test_example') {
  const configService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'CULQI_SECRET_KEY') return secretKey;
      if (key === 'CULQI_API_URL') return defaultValue;
      return undefined;
    }),
  } as unknown as ConfigService;

  return new CulqiService(configService);
}
