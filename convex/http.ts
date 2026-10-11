import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Serves the JWKS and sign-in endpoints Convex Auth needs.
auth.addHttpRoutes(http);

export default http;
