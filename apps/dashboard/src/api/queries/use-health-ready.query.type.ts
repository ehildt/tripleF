export interface HealthCheckInfo {
  status: string;
}

export interface HealthCheckDetails {
  [key: string]: HealthCheckInfo;
}

export interface HealthResponse {
  status: string;
  info: HealthCheckDetails;
  error: HealthCheckDetails | Record<string, never>;
  details: HealthCheckDetails;
}
