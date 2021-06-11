require('dotenv').config();
const app = require("./app");
const expect = require("expect-runtime");

expect(process.env.MAXIMUM_ZOOM_LEVEL_USING_GLOBAL_DATASET).defined();
expect(process.env.MAXIMUM_ZOOM_LEVEL_HANDLING_ZOOM_TARGET).defined();


app.listen(process.env.PORT, () => {
  console.log("listening on %d", process.env.PORT);
});
