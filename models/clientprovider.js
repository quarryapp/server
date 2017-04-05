import mongoose, { Schema } from 'mongoose';

/**
 * Relational modal which can be used to determine which clients are using which providers
 */

export default mongoose.model('clientprovider', {
    provider: Schema.Types.ObjectId,
    client: Schema.Types.ObjectId
});