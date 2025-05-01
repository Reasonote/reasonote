import React from "react";

import {EmailSendRoute} from "@/app/api/email/send/routeSchema";
import {
  useApolloClient,
  useQuery,
} from "@apollo/client";
import {trimAllLines} from "@lukebechtel/lab-ts-utils";
import {Button} from "@mui/material";
import {
  GetRsnUserSysdataFlatDocument,
  updateRsnUserSysdataFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

export function AddUserToBetaButton({ userId }: { userId: string }) {
  const ac = useApolloClient();

  const userSysdataRes = useQuery(GetRsnUserSysdataFlatDocument, {
    variables: {
      filter: {
        rsnUserId: {
          eq: userId
        }
      },
    }
  });

  const isBetaUser = JSONSafeParse(userSysdataRes.data?.rsnUserSysdataCollection?.edges[0]?.node?.extraLicenseInfo ?? "{}").data["Reasonote-Beta"] ?? false;

  const handleToggleBeta = async () => {
    const { data, errors } = await ac.mutate({
      mutation: updateRsnUserSysdataFlatMutDoc,
      variables: {
        set: {
          extraLicenseInfo: JSON.stringify({
            "Reasonote-Beta": !isBetaUser
          })
        },
        filter: {
          rsnUserId: {
            eq: userId
          }
        },
        atMost: 1
      }
    });

    if (errors || !data || data.updateRsnUserSysdataCollection.affectedCount < 1) {
      console.error({ data, errors });
      alert('Error updating beta status (check console logs)');
    } else if (!isBetaUser) {
      // Send email to user when added to beta
      await EmailSendRoute.call({
        to: userSysdataRes.data?.rsnUserSysdataCollection?.edges[0]?.node?.authEmail ?? "",
        subject: '🎉 Welcome to Reasonote!',
        text: trimAllLines(`
          👋 Welcome to Reasonote!
          
          You've been added to the Reasonote Beta program.
          
          📢 Please let us know if you have any feedback or suggestions: feedback@reasonote.com .
  
          Login at https://reasonote.com to get started.
        `),
        html: trimAllLines(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Reasonote</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center;">
                  <div style="padding: 10px 0; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0;">
                      <img src="https://www.reasonote.com/favicon.ico" alt="Reasonote Logo" style="width: 64px;">
                  </div>
                  <div style="padding: 20px;">
                      <h1 style="font-size: 24px; color: #333333;">👋 Welcome to Reasonote!</h1>
                      <p style="font-size: 16px; color: #666666; line-height: 1.5;">You've been accepted into the Reasonote Beta program.</p>
                      <p style="font-size: 16px; color: #666666; line-height: 1.5;">📢 Please <a href="mailto:feedback@reasonote.com" style="color: #4285f4; text-decoration: none;">let us know</a> if you have any feedback or suggestions</p>
                      <a href="https://reasonote.com" style="display: inline-block; margin-top: 20px; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #4285f4; text-decoration: none; border-radius: 5px;">Login To Get Started</a>
                  </div>
                  <div style="padding: 10px 0; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999999;">
                      &copy; 2024 Reasonote. All rights reserved.
                  </div>
              </div>
          </body>
          </html>
        `)
      });
    }
  };

  if (userSysdataRes.loading) {
    return <div>Loading...</div>;
  }

  return (
    <Button
      variant="outlined"
      color={isBetaUser ? "error" : "success"}
      onClick={handleToggleBeta}
    >
      {isBetaUser ? "Remove As Beta User" : "Add As Beta User"}
    </Button>
  );
}