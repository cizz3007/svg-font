export interface Pipeline {
  names: string[];
  icons: any;
  selectionPath: string;
  forceOverride: boolean;
  visible: boolean;
  outputDir?: string;
  whenFinished?: (values: any) => any;
}