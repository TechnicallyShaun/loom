#!/usr/bin/env node

const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "init": {
      const { init } = await import("./commands/init.js");
      return init(args);
    }
    case "register": {
      const { register } = await import("./commands/register.js");
      return register(args);
    }
    case "compile": {
      const { compile } = await import("./commands/compile.js");
      return compile(args);
    }
    case "deploy": {
      const { deploy } = await import("./commands/deploy.js");
      return deploy(args);
    }
    case "harvest": {
      const { harvest } = await import("./commands/harvest.js");
      return harvest(args);
    }
    case "diff": {
      const { diff } = await import("./commands/diff.js");
      return diff(args);
    }
    case "discover": {
      const { discover } = await import("./commands/discover.js");
      return discover(args);
    }
    default:
      console.log(`
loom — weave AI skills once, compile to every coding agent.

Usage:
  loom init                         Create ~/.loom/ with starter structure
  loom register <name> <path>       Register a project for compilation
  loom compile [project]            Compile source to target-specific output
  loom deploy [project]             Copy compiled output to project paths
  loom harvest [project]            Scan for changes and merge back to source
  loom diff [project]               Preview what deploy would change
  loom discover                     Show registered projects and status
      `);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
