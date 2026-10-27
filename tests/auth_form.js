let posted = null;
const grab = (e) => { e.preventDefault(); posted = Object.fromEntries(new FormData(e.target)); };
document.addEventListener("submit", grab, true);
try {
    const si = $("#auth-demo-signin-title").closest(".ui-auth-form");
    const form = () => si.querySelector("form");
    const field = (n) => form().querySelector(`[name=${n}]`);
    if (si.getAttribute("aria-labelledby") !== "auth-demo-signin-title" || si.querySelector("h2").textContent !== "Sign in") return "the sign-in form is not named by its heading";
    if (form().method !== "post" || !form().action.endsWith("/login")) return `sign in posts to ${form().action}`;
    if (field("mode").type !== "hidden" || field("mode").value !== "signin") return "no hidden mode=signin";
    if (field("email").getAttribute("autocomplete") !== "username" || field("email").type !== "email" || field("email").value !== "ada@example.com") return "the email is not a username field filled in again";
    if (field("password").getAttribute("autocomplete") !== "current-password") return "the password is not current-password";
    if (field("email").labels[0]?.textContent !== "Email" || field("password").labels[0]?.textContent !== "Password") return "fields are not labelled";
    if (!si.querySelector("[role=alert]")?.textContent.includes("Wrong email or password")) return "the server's error is not shown";
    if (si.querySelectorAll(".ui-auth-form-provider").length !== 2 || si.querySelector(".ui-auth-form-provider").getAttribute("href") !== "#auth-github") return "providers are not links";
    if (!field("remember") || field("remember").type !== "checkbox") return "no remember me";
    // Show / hide.
    const eye = si.querySelector("button[aria-controls='auth-demo-signin-password']");
    eye.click(); await wait();
    if (field("password").type !== "text" || eye.getAttribute("aria-pressed") !== "true" || eye.getAttribute("aria-label") !== "Hide password") return "show password did not show it";
    eye.click(); await wait();
    // Sign in, checked before it is sent.
    type(field("email"), ""); si.querySelector(".ui-auth-form-submit").click(); await wait(100);
    if (posted) return "an empty sign-in was sent";
    if (field("email").getAttribute("aria-invalid") !== "true" || !document.getElementById("auth-demo-signin-email-error")?.textContent.includes("Enter your email")) return "an empty email says nothing";
    if (!(field("email").getAttribute("aria-describedby") || "").includes("auth-demo-signin-email-error")) return "the email is not described by its error";
    if (document.activeElement !== field("email")) return "the focus is not on the first wrong field";
    type(field("email"), "ada@example.com"); type(field("password"), "hunter22"); await wait();
    if (field("email").getAttribute("aria-invalid") === "true") return "typing did not clear the error";
    si.querySelector(".ui-auth-form-submit").click(); await wait();
    if (!posted || posted.mode !== "signin" || posted.email !== "ada@example.com" || posted.password !== "hunter22") return `sign in sent ${JSON.stringify(posted)}`;
    const btn = si.querySelector(".ui-auth-form-submit");
    if (btn.getAttribute("aria-busy") !== "true" || !btn.textContent.includes("Signing in…") || !btn.querySelector(".ui-auth-form-spin")) return "the button does not show it is busy";
    posted = null; btn.click(); await wait();
    if (posted) return "a busy form was sent twice";
    // Switch to forgot, in place.
    [...si.querySelectorAll("button")].find((b) => b.textContent === "Forgot password?").click(); await wait(100);
    if (si.querySelector("h2").textContent !== "Reset your password" || !form().action.endsWith("/forgot") || field("mode").value !== "forgot") return "Forgot password? did not switch to the forgot form";
    if (field("password")) return "the forgot form asks for a password";
    if (field("email").value !== "ada@example.com" || field("email").getAttribute("autocomplete") !== "email") return "the email was not kept, or is not autocomplete=email";
    if (si.querySelector(".ui-auth-form-msg")) return "the server's sign-in error still shows on another form";
    if (document.activeElement !== si.querySelector("h2")) return "the focus did not go to the new heading";
    if (si.querySelector(".ui-auth-form-submit").getAttribute("aria-busy")) return "switching kept the busy state";
    [...si.querySelectorAll("button")].find((b) => b.textContent.includes("Back to sign in")).click(); await wait();
    if (si.querySelector("h2").textContent !== "Sign in") return "Back to sign in did not go back";
    [...si.querySelectorAll("button")].find((b) => b.textContent === "Create an account").click(); await wait();
    if (si.querySelector("h2").textContent !== "Create an account" || !form().action.endsWith("/signup")) return "Create an account did not switch";
    if (si.querySelector(".ui-auth-form-providers") === null) return "providers are not offered on sign-up";
    // Sign up: name, new password with a meter, confirm, terms.
    const su = $("#auth-demo-signup-title").closest(".ui-auth-form");
    const sf = (n) => su.querySelector(`form [name=${n}]`);
    const send = async () => { posted = null; su.querySelector(".ui-auth-form-submit").click(); await wait(100); };
    const err = (f) => document.getElementById(`auth-demo-signup-${f}-error`)?.textContent ?? "";
    if (sf("name").getAttribute("autocomplete") !== "name" || !sf("name").labels[0].textContent.includes("optional")) return "the name is not an optional name field";
    if (sf("password").getAttribute("autocomplete") !== "new-password" || sf("confirm").getAttribute("autocomplete") !== "new-password") return "new passwords are not new-password";
    if (sf("password").minLength !== 10) return "min_password is not the minlength";
    if (!sf("terms") || !su.querySelector("a[href='#terms']")) return "the terms are not asked for, with a link";
    type(sf("email"), "grace@example.com"); type(sf("password"), "short"); await send();
    if (posted || !err("password").includes("at least 10")) return `a short password: ${err("password")}`;
    const meter = document.getElementById("auth-demo-signup-password-meter");
    type(sf("password"), "Correct-Horse-7"); await wait();
    if (!meter.textContent.includes("strong") || meter.getAttribute("aria-live") !== "polite") return `the meter: ${meter.textContent}`;
    type(sf("confirm"), "Correct-Horse-8"); await send();
    if (posted || !err("confirm").includes("do not match") || document.activeElement !== sf("confirm")) return "different passwords were not caught";
    type(sf("confirm"), "Correct-Horse-7"); await send();
    if (posted || !err("terms").includes("Accept the terms")) return "the terms were not asked for";
    sf("terms").click(); type(sf("name"), "Grace"); await send();
    if (!posted || posted.mode !== "signup" || posted.terms !== "1" || posted.name !== "Grace" || posted.confirm !== "Correct-Horse-7") return `sign up sent ${JSON.stringify(posted)}`;
    if (!su.querySelector(".ui-auth-form-submit").textContent.includes("Creating your account…")) return "sign up does not say it is busy";
    const eye2 = su.querySelector(".ui-auth-form-eye");
    eye2.click(); await wait();
    if (sf("confirm").type !== "text") return "show password does not show the confirmation too";
    // Forgot, with a notice; reset, with a token.
    const fg = $("#auth-demo-forgot-title").closest(".ui-auth-form");
    if (!fg.querySelector("[role=status]")?.textContent.includes("check your inbox")) return "the notice is not shown";
    if (!fg.querySelector("form").action.endsWith("/forgot")) return "forgot posts elsewhere";
    const rs = $("#auth-demo-reset-title").closest(".ui-auth-form");
    const rf = (n) => rs.querySelector(`form [name=${n}]`);
    if (rf("token")?.type !== "hidden" || rf("token").value !== "demo-7f3a9c" || rf("mode").value !== "reset") return "the reset form does not carry its token";
    if (rf("email")?.getAttribute("autocomplete") !== "username" || !rf("email").hidden) return "no hidden username for password managers";
    if (!rs.querySelector("form").action.endsWith("/reset")) return "reset posts elsewhere";
    if (rf("password").getAttribute("aria-invalid") !== "true" || !document.getElementById("auth-demo-reset-password-error")?.textContent.includes("you had")) return "errors from the server are not shown on their field";
    type(rf("password"), "Brand-new-pass-1"); await wait();
    if (rf("password").getAttribute("aria-invalid") === "true") return "typing did not clear the server's field error";
    type(rf("confirm"), "Brand-new-pass-1"); posted = null; rs.querySelector(".ui-auth-form-submit").click(); await wait();
    if (!posted || posted.token !== "demo-7f3a9c" || posted.password !== "Brand-new-pass-1") return `reset sent ${JSON.stringify(posted)}`;
} finally {
    document.removeEventListener("submit", grab, true);
}
