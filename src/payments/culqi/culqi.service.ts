import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_CULQI_API_URL = 'https://api.culqi.com/v2';

export interface CulqiChargeRequest {
  amount: number;
  currency_code: 'PEN';
  email: string;
  source_id: string;
  installments?: number;
  antifraud_details: {
    first_name: string;
    last_name: string;
    phone_number?: string;
    device_finger_print_id: string;
  };
  authentication_3DS?: {
    eci: string;
    xid: string;
    cavv: string;
    protocolVersion: string;
    directoryServerTransactionId: string;
  };
}

export interface CulqiChargeResponse {
  id?: string;
  object?: string;
  duplicated?: boolean;
  outcome?: {
    type?: string;
    code?: string;
    merchant_message?: string;
    user_message?: string;
  };
  user_message?: string;
  merchant_message?: string;
  [key: string]: unknown;
}

export interface CulqiChargeResult {
  charge: CulqiChargeResponse;
  requires3DS: boolean;
}

export interface CulqiEvent {
  id: string;
  type: string;
  data: CulqiChargeResponse | string;
  [key: string]: unknown;
}

export interface CulqiRefundResponse {
  id: string;
  charge_id: string;
  status: string;
  [key: string]: unknown;
}

@Injectable()
export class CulqiService {
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>(
      'CULQI_API_URL',
      DEFAULT_CULQI_API_URL,
    );
  }

  async createCharge(request: CulqiChargeRequest): Promise<CulqiChargeResult> {
    const response = await this.request('/charges', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const payload = await this.readResponse<CulqiChargeResponse>(response);
    if (response.status === 201) {
      return { charge: payload, requires3DS: true };
    }

    if (!response.ok) {
      throw new BadGatewayException({
        message:
          payload.user_message ??
          payload.outcome?.user_message ??
          'Culqi rejected the payment request',
        providerCode: payload.outcome?.code,
      });
    }

    return { charge: payload, requires3DS: false };
  }

  async createRefund(
    chargeId: string,
    amount: number,
  ): Promise<CulqiRefundResponse> {
    const response = await this.request('/refunds', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        charge_id: chargeId,
        reason: 'solicitud_comprador',
      }),
    });
    const payload = await this.readResponse<CulqiRefundResponse>(response);
    if (!response.ok) {
      throw new BadGatewayException('Culqi rejected the refund request');
    }
    return payload;
  }

  async getEvent(eventId: string): Promise<CulqiEvent> {
    const response = await this.request(
      `/events/${encodeURIComponent(eventId)}`,
      { method: 'GET' },
    );
    const payload = await this.readResponse<CulqiEvent>(response);
    if (!response.ok) {
      throw new BadGatewayException('Culqi could not verify the webhook event');
    }
    return payload;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const secretKey = this.configService.get<string>('CULQI_SECRET_KEY');
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Culqi payment processing is not configured',
      );
    }

    try {
      return await fetch(`${this.apiUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      throw new ServiceUnavailableException(
        'The payment provider is temporarily unavailable',
      );
    }
  }

  private async readResponse<T extends object>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException(
        'The payment provider returned an invalid response',
      );
    }
  }
}
