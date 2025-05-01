import {useEffect} from "react";

import {
  makeVar,
  useReactiveVar,
} from "@apollo/client";

// Create a reactive variable for the dropzone disabled state
export const dropzoneDisabledVar = makeVar(false);

export const useDisableDropzone = () => {
  useEffect(() => {
    // Disable the dropzone when the hook is used
    dropzoneDisabledVar(true);

    // Re-enable the dropzone when the component unmounts
    return () => {
      dropzoneDisabledVar(false);
    };
  }, []);
};

// This hook will be used by the FullScreenDropzone component
export const useDropzoneState = () => {
  return useReactiveVar(dropzoneDisabledVar);
};

export default useDisableDropzone;
