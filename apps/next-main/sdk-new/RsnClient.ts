import {LicenseClientModel} from "./models/LicenseClientModel";
import {SkillClientModel} from "./models/SkillClientModel";
import {UserClientModel} from "./models/UserClientModel";
import {
  RsnClientCtx,
  RsnClientCtxConstructorArgs,
} from "./RsnClientCtx";

export interface RsnClientConstructorArgs {
    ctx?: RsnClientCtx;
    ctxArgs?: RsnClientCtxConstructorArgs;
}

export class RsnClient {
    ctx: RsnClientCtx;

    constructor(readonly args: RsnClientConstructorArgs){
        if (args.ctx){
            this.ctx = args.ctx;
            return;
        }
        else if (args.ctxArgs){
            this.ctx = new RsnClientCtx(args.ctxArgs);
            return;
        }
        else {
            throw new Error("RsnClient constructor requires either a ctx or ctxArgs argument.");
        }
    }


    get posthog(){
        return this.ctx.posthog;
    }

    get ac(){
        return this.ctx.ac;
    }

    get sb(){
        return this.ctx.sb;
    }

    async currentUserId(){
        const usrId = (await this.sb.auth.getUser()).data.user?.id;

        return usrId ? `rsnusr_${usrId}` : null;
    }

    skill = new SkillClientModel(this);
    user = new UserClientModel(this);
    license = new LicenseClientModel(this);
}
