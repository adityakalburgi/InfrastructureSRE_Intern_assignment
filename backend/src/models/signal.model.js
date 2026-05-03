
import mongoose from "mongoose";
const schema=new mongoose.Schema({
 component_id:String,
 message:String,
 timestamp:Date,
 work_item_id:String
});
export default mongoose.model("Signal",schema);
