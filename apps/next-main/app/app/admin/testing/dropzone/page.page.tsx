'use client'
import {AnkiFileHandler} from "@/components/FullscreenDropzone/AnkiFileHandler";
import {
  FileHandlerRegistry,
} from "@/components/FullscreenDropzone/fileHandlerSystem";
import {
  FullScreenDropzone,
} from "@/components/FullscreenDropzone/FullscreenDropzone";

const fileHandlerRegistry = new FileHandlerRegistry();
fileHandlerRegistry.registerHandler(new AnkiFileHandler());


export default function Page(){
    return <FullScreenDropzone
      fileHandlerRegistry={fileHandlerRegistry} 
      onComplete={() => {
        
      }} 
    />
}