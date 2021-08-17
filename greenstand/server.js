require('dotenv').config();
const log = require("loglevel");
log.setDefaultLevel("info");
const app = require("./app");
const expect = require("expect-runtime");

expect(process.env.MAXIMUM_ZOOM_LEVEL_USING_GLOBAL_DATASET).defined();
expect(process.env.MAXIMUM_ZOOM_LEVEL_HANDLING_ZOOM_TARGET).defined();


app.listen(process.env.PORT, () => {
  log.info("listening on %d", process.env.PORT);
});
