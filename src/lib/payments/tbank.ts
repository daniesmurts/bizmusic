import crypto from 'crypto';

interface TBankConfig {
  terminalKey: string;
  password: string;
}

interface InitResponse {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  Amount: number;
  OrderId: string;
  Status: string;
  PaymentId: string;
  PaymentURL?: string;
}

interface NotificationData {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: string;
  PaymentId: string;
  ErrorCode: string;
  Amount: number;
  RebillId?: string;
  CardId?: string;
  Token: string;
  Pan?: string;
  ExpDate?: string;
  [key: string]: unknown;
}

export class TBankClient {
  private terminalKey: string;
  private password: string;
  private baseUrl = 'https://securepay.tinkoff.ru/v2/';

  constructor(config: TBankConfig) {
    this.terminalKey = config.terminalKey;
    this.password = config.password;
  }

  private generateToken(params: Record<string, unknown>): string {
    const data: Record<string, unknown> = { ...params, Password: this.password };
    const sortedKeys = Object.keys(data)
      .filter((key) => key !== 'Token' && key !== 'Shops' && key !== 'Receipt' && key !== 'DATA')
      .sort();

    const signString = sortedKeys.map((key) => String(data[key])).join('');
    return crypto.createHash('sha256').update(signString).digest('hex');
  }

  async init(params: {
    Amount: number;
    OrderId: string;
    Description?: string;
    Recurrent?: 'Y' | 'N';
    CustomerKey: string;
    NotificationURL?: string;
    SuccessURL?: string;
    FailURL?: string;
    DATA?: Record<string, string>;
  }): Promise<InitResponse> {
    const body: Record<string, unknown> = {
      TerminalKey: this.terminalKey,
      ...params,
    };
    body.Token = this.generateToken(body);

    const response = await fetch(`${this.baseUrl}Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.json();
  }

  async getState(paymentId: string): Promise<InitResponse> {
    const body: Record<string, unknown> = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };
    body.Token = this.generateToken(body);

    const response = await fetch(`${this.baseUrl}GetState`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.json();
  }

  async charge(params: {
    PaymentId: string;
    RebillId: string;
  }): Promise<InitResponse> {
    const body: Record<string, unknown> = {
      TerminalKey: this.terminalKey,
      ...params,
    };
    body.Token = this.generateToken(body);

    const response = await fetch(`${this.baseUrl}Charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.json();
  }

  /**
   * Validates the notification token sent by T-Bank
   */
  checkNotificationToken(notification: NotificationData): boolean {
    const { Token, ...params } = notification;
    const expectedToken = this.generateToken(params);
    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(Token),
        Buffer.from(expectedToken)
      );
    } catch {
      return false;
    }
  }
}

export const tbank = new TBankClient({
  terminalKey: process.env.TBANK_TERMINAL_KEY || '',
  password: process.env.TBANK_PASSWORD || '',
});
