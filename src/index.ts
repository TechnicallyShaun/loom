#!/usr/bin/env node

const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "init":
      const { init } = await import("./commands/init.js");
      return init(args);
    case "compile":
      const { compile } = await import("./commands/compile.js");
      return compile(args);
    case "deploy":
      const { deploy } = await import("./commands/deploy.js");
      return deploy(args);
    case "add-project":
      const { addProject } = await import("./commands/add-project.js");
      return addProject(args);
    case "discover":
      const { discover } = await import("./commands/discover.js");
      return discover(args);
    default:
      console.log(`
loom — weave AI skills once, compile to every coding agent.

Usage:
  loom init              Create a .loom/ directory with starter config
  loom compile           Build target-specific output from source skills
  loom deploy            Copy compiled output to registered locations
  loom add-project <path>  Register a project for deployment
  loom discover          Show found configs, skills, and targets
      `);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
