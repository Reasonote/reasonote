import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // TODO: trying to fix build...
  // const supabase = createMiddlewareSupabaseClient<Database>({ req, res });

  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();

  // Set the value in a custom header
  // res.headers.set('x-my-custom-header', 'hello');

  // console.log("hi from middleware", req.url);


  // // Set a cookie
  // res.cookies.set('myValue', 'hello');

  return res;
}
