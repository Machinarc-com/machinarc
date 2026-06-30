import { useEffect, useState } from "react";
import { supabase, supabaseUrl } from "./supabase";
import { LogoMark } from "./Logo";
import { saveSession, type Session } from "./store";

export default function AuthCallback({ onSignIn }: { onSignIn: (session: Session)=>void }) {
 const [message,setMessage]=useState("Completing sign in...");
 useEffect(()=>{
 const search=new URLSearchParams(window.location.search);
 const errorParam=search.get("error");
 const codeParam=search.get("code");
  console.log("=== CALLBACK ===");
  console.log("Current URL:", window.location.href);
  console.log("Code:", codeParam);
  console.log("LocalStorage:", Object.keys(localStorage));
 if (!supabase){setMessage("Supabase is not configured.");return;}
 let cancelled = false;
 (async()=>{
 if(errorParam){setMessage(`OAuth error: ${errorParam}`);return;}
 try{
 let session=null;
 let exchangeResult:any=null;
 if(codeParam){ exchangeResult=await supabase.auth.exchangeCodeForSession(codeParam); console.log(exchangeResult);
 if(cancelled)return;
 if(exchangeResult.error){setMessage(exchangeResult.error.message);return;}
 session=exchangeResult.data.session;
 }
 if(!session){
 const sessionResult=await supabase.auth.getSession();
 console.log(sessionResult);
 if(cancelled)return;
 if(sessionResult.error){setMessage(sessionResult.error.message);return;}
 session=sessionResult.data.session;
 }
 if(!session?.user?.email){setMessage('No active Supabase session found.');return;}
 const next={email:session.user.email,org:session.user.user_metadata?.org??session.user.email};
 saveSession(next);onSignIn(next);history.replaceState(null,'','/');
 }catch(e:any){setMessage(e?.message??String(e));}
 })();
 return ()=>{cancelled=true};
 },[onSignIn]);
 return <div className="flex min-h-screen items-center justify-center"><div><LogoMark/><p>{message}</p></div></div>;
}
