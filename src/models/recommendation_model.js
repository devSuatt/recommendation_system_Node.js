const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecommendationSchema = new Schema({
    itemId: { type: String, require: true, },
    score: { type: String, required: true, },

}, { collection: 'recommendation', timestamps: true });

const Recommendation = mongoose.model('Recommendation', RecommendationSchema);

module.exports = Recommendation;
