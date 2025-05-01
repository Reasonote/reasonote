import {EmailSendRoute} from "../../email/send/routeSchema";
import {getServiceSb} from "./getServiceSb";

export async function testSignupBetaUser(){
    const {serviceSb} = await getServiceSb();
  
    const email = `testuser-${Math.random()}@reasonote.com`
    const password = 'password'
  
    const newUser = await serviceSb.auth.signUp({
      email,
      password,
    })

    const newUserId = newUser.data?.user?.id
  
    if (newUser.error || !newUserId){
      throw new Error(`Failed to create new user!`)
    }
  
    // Now, add {"Reasonote-Beta":true} to the user license
    const sysdataResult = await serviceSb.from('rsn_user_sysdata').update({
      extra_license_info: JSON.stringify({
        "Reasonote-Beta": true,
      })
    }).eq('auth_id', newUserId).select('*').single()

    // Send email to user
    await EmailSendRoute.call({
      to: email,
      subject: 'Welcome to Reasonote!',
      text: `
        Welcome to Reasonote!

        You have been added to the Reasonote Beta program.
        
        Please let us know if you have any feedback or suggestions.

        Login at https://reasonote.com
      `,
      html: `
        <h1>Welcome to Reasonote!</h1>
        <p>You have been added to the Reasonote Beta program.</p>
        <p>Please let us know if you have any feedback or suggestions</p>

        <a href="https://reasonote.com">Login and Start Learning</a>
      `
    })
  
    if (sysdataResult.error){
      console.error(`Failed to update sysdata!`, sysdataResult.error)
      throw new Error(`Failed to update sysdata!`)
    }
  
    return {
      id: newUser.data?.user?.id,
      email,
      password,
    }
}