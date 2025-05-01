export interface HandlerResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface FileHandlerComponentProps {
    result: HandlerResult;
    onComplete: () => void;
}

export interface FileHandler {
    accepts: string[];
    handleFile: (file: File) => Promise<HandlerResult>;
    // ReactComponent: React.ComponentType<FileHandlerComponentProps>;
    // TitleIcon?: React.ComponentType;
    // Title?: React.ComponentType;
    ReactComponent: any;
    TitleIcon?: any;
    Title?: any;
}

export class FileHandlerRegistry {
    private handlers: FileHandler[] = [];

    registerHandler(handler: FileHandler) {
        this.handlers.push(handler);
    }

    getHandlerForFile(file: File): FileHandler | undefined {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return this.handlers.find(handler => handler.accepts.includes(extension));
    }
  
    getAllAcceptedFileTypes(): string[] {
      return Array.from(new Set(this.handlers.flatMap(handler => handler.accepts)));
    }
}