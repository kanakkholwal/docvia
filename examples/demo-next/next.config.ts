import { withDocvia } from "@docvia/build/next";

const withDocs = withDocvia();

// portless serves this at next.demo.docvia.localhost; Next only trusts one-label *.localhost by default.
export default withDocs({
	agentRules: false,
	allowedDevOrigins: ["*.demo.docvia.localhost"],
});
