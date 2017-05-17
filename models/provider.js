import mongoose from 'mongoose';
/**
 * Created by Jari on 28/03/2017.
 */
export default mongoose.model('provider', {
    type: String,
    name: String,
    config: Object,
    data: Object,
    owner: String // client id
});