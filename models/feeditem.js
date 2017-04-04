import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

/**
 * Created by Jari on 28/03/2017.
 */
const schema = Schema({
    rank: Number,
    type: String,
    name: String,
    timestamp: Number,
    score: Number,
    owner: Schema.Types.ObjectId,
    expiration: Date,
    date: Object
});

schema.plugin(mongoosePaginate);

export default mongoose.model('feeditem', schema);