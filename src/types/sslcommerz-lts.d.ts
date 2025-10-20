declare module 'sslcommerz-lts' {
  export default class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);
    init(data: any): Promise<any>;
  }
}
