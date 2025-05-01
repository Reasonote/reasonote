import {Tailwind} from "@react-email/components";

import config from "../../../../../../tailwind.config";

export const EmailProvider = ({children}: {children: React.ReactNode}) => {
  return (
    <Tailwind config={config as any}>
      {children}
    </Tailwind>
  );
};