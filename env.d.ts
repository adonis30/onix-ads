declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      APP_BASE_URL: string;
      S3_BUCKET: string;
      S3_REGION: string;
      S3_KEY: string;
      S3_SECRET: string;
      LEMONSQUEEZY_API_KEY: string;
      LEMONSQUEEZY_STORE_ID: string;
    }
  }
}
export {};