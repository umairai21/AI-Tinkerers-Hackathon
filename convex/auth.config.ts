// Convex Auth issues its own JWTs from this deployment's HTTP actions URL.
// Without this file ctx.auth always sees a signed-out user.
const authConfig = {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
