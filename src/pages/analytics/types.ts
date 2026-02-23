export interface WorkerInfo {
  id: string;
  name: string;
}

export interface TransformedJob {
  id: string;
  numerZlecenia: string;
  date: string;
  productTypeId: string;
  quantity: number;
  workers: {
    workerId: string;
    resourceId: string;
    hoursWorked: number;
    speedIndexContributionPercentage?: number;
  }[];
  totalHours: number;
}

export interface TeamInfo {
  key: string;
  workerIds: string[];
  times: number[];
  count: number;
  avgTime: number;
  jobs: TransformedJob[];
}

export interface ProductEfficiency {
  productId: string;
  efficiency: number;
  jobCount: number;
}
