const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'beacon_statistics';
const collectionName = 'beacon_statistics';

const startDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
const endDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
  const col = client.db(dbName).collection(collectionName);

  const aggregationSteps = [
    {
      $project: { 
        config: 1,
        fromPeriod: {
          $cond: {
            if: { 
              $and: [
                { $gt: ['$timeStamp', startDate] },
                { $lt: ['$timeStamp', endDate] }
              ]
            },
            then: 1,
            else: 0
          },
        },
      },
    },
    { 
      $project: {
        config: {
          happy: { $multiply: ['$config.happy', '$fromPeriod'] },
          neutral: { $multiply: ['$config.neutral', '$fromPeriod'] },
          sad: { $multiply: ['$config.sad', '$fromPeriod'] },
        }
      }
    },
    {
      $group: {
        _id: 1,
        happy: { $sum: '$config.happy' },
        neutral: { $sum: '$config.neutral' },
        sad: { $sum: '$config.sad' }, 
      }
    },
    {
      $project: {
        _id: 0,
      }
    }
  ];

  col.aggregate(aggregationSteps).toArray().then(result => {
    console.log(result);
    client.close(true);
  })
});
