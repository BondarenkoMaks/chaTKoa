/* global describe, context, it */

const request = require('request-promise');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('server', () => {

  describe('POST /publish', () => {

    it('sends a message to all subscribers', async function () {

      const testObj = {user: "test", message: "text"};

      const subscribers = Promise.all([
        request({
          method: 'GET',
          url: 'http://127.0.0.1:3000/subscribe',
          timeout: 500
        }),
        request({
          method: 'GET',
          url: 'http://127.0.0.1:3000/subscribe',
          timeout: 500
        })
      ]);

      await sleep(20);

      const publisher = await request({
        method: 'POST',
        url: 'http://127.0.0.1:3000/publish',
        json: true,
        body: testObj

      });

      const result = await subscribers;

        result.forEach(messages => {
            JSON.parse(messages).forEach((msg)=> msg.message.should.eql(testObj.message));
      });

      publisher.should.eql('ok');

    });
  });

});
