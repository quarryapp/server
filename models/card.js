import mongoose from 'mongoose';
/**
 * Created by Jari on 28/03/2017.
 */
export default mongoose.model('card', {
    type: String,
    name: String,
    config: Object
});