import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

/**
 * Created by Jari on 28/03/2017.
 */
const schema = Schema({
    rank: Number,
    provider: Schema.Types.ObjectId,
    size: String,
    url: String,
    ranking: Number,
    type: String,
    name: String,
    title: String,
    order: Number,
    timestamp: Number,
    score: Number,
    owner: Schema.Types.ObjectId,
    expiration: Date,
    data: Object
});

schema.plugin(mongoosePaginate);

export default mongoose.model('feeditem', schema);