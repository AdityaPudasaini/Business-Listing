   import nextVitals from "eslint-config-next/core-web-vitals";

   const eslintConfig = [
     ...nextVitals,
     {
       rules: {
         "react-hooks/set-state-in-effect": "warn",
         "react-hooks/static-components": "warn",
         "react-hooks/immutability": "warn",
         "react-hooks/refs": "warn",
         "react-hooks/purity": "warn",
       },
     },
   ];

   export default eslintConfig;