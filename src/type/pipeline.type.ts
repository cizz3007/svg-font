export interface Pipeline {
    names?: string[];
    icons: string[];
    selectionPath: string;
    /* 같은 이름의 파일이 기존에 존재할 경우 덮어 씌울 것인지를 결정하는 속성입니다. true면 덮어 씌웁니다.*/
    forceOverride?: boolean;
    /* Chrome Browser를 open할 것인지를 정하는 속성*/
    visible?: boolean;
    /* 결과물이 출력되는 디렉토리 입니다.*/
    outputDir?: string;
    /* svg 파일이 위치하는 디렉토리를 입력해 주세요.*/
    directory?: string;
    whenFinished?: (values: any) => any;
}