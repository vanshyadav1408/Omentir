import { Config } from "@remotion/cli/config";
import path from "node:path";

Config.setPublicDir(path.join(process.cwd(), "../public"));
Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
