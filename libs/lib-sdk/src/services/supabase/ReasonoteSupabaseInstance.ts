import { createSimpleLogger } from '@reasonote/lib-utils';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

export interface ReasonoteSupabaseConfig {
    supabaseUrl: string;
    supabaseAnonKey: string;
}

export interface ReasonoteSupabasePostAuthInitializeProps {
    // auth0User: Auth0User & { email: string };
    basicUser: { loginEmail: string }
}

export class ReasonoteSupabase {
    private _logger = createSimpleLogger("ReasonoteSupabaseInstance");
    private _supabase: SupabaseClient;
    private _currentUserId: string | undefined;
    private _postAuthInitializeProps?: ReasonoteSupabasePostAuthInitializeProps;
    private _postAuthInitialized = false;

    constructor(private readonly _config: ReasonoteSupabaseConfig) {
        // Create the Supabase client using the Anon Key
        const supabase_url = _config.supabaseUrl;
        const anon_key = _config.supabaseAnonKey;
        console.debug(`Initializing supabase. (SUPABASE_BASE_URL: ${supabase_url}, SUPABASE_ANON_KEY: ${anon_key})`);
        this._supabase = createClient(supabase_url, anon_key);

        // TODO: possibly auth fix?

    }

    public async login_jwt() {
        return await this._supabase.rpc('login_jwt')
    }

    /**
     * This initializes supabase, once we have the user's Profile ID.
     * @param userProfileId The user's profile id.
     */
    public async postAuthInitialize(props: ReasonoteSupabasePostAuthInitializeProps) {
        // Set the auth token for the user in supabase
        // this.supabase.auth.setAuth(supabaseToken);

        this._postAuthInitializeProps = props;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        // supabase.auth.stateChangeEmitters.forEach((x) =>
        //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //     //@ts-ignore
        //     x.callback("TOKEN_REFRESHED", supabase.auth.currentSession),
        // );

        // Call the login route to register the fact that this user is logging in.
        // This will also create the user in the system, if they do not already exist.
        await this.login_jwt();

        // Now that the supabase client has had the client's auth token set,
        // we can use the authenticated version of the supabase client to get the user profile id.
        // TODO: The backend should put the user's Platform Id in the supabase token when it regenerates it, for simplicity.
        const userProfileId = await this._supabase
            .from("user_profile")
            .select("id")
            .eq("login_email", props.basicUser.loginEmail)
            .single()
            .then((x) => x.data?.id);

        if (userProfileId) {
            this._logger.debug(`User profile id is: ${userProfileId}`);
            this._currentUserId = userProfileId;
        } else {
            this._logger.error(
                `Did not receive userProfileId from Supabase for user with loginEmail: ${props.basicUser.loginEmail}. This is probably because the user has not yet created a profile, but should rarely happen.`,
            );
        }

        this._postAuthInitialized = true;
    }

    get supabase() {
        return this._supabase;
    }

    get currentUserId() {
        return this._currentUserId;
    }
}
