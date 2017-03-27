import mongoose from 'mongoose';
/**
 * Created by Jari on 28/03/2017.
 */
export default mongoose.model('client', {
    id: String,
    token: String
});