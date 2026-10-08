import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeJobVideos, parseYoutubeLink } from './youtubeUrl.ts';

test('parseYoutubeLink accepts watch, share, shorts, and embed links', () => {
  assert.deepEqual(parseYoutubeLink('https://www.youtube.com/watch?v=y4mS3RU2fdk'), {
    youtubeId: 'y4mS3RU2fdk',
    url: 'https://www.youtube.com/watch?v=y4mS3RU2fdk',
  });
  assert.equal(parseYoutubeLink('https://youtu.be/y4mS3RU2fdk')?.youtubeId, 'y4mS3RU2fdk');
  assert.equal(parseYoutubeLink('https://www.youtube.com/shorts/y4mS3RU2fdk')?.youtubeId, 'y4mS3RU2fdk');
  assert.equal(parseYoutubeLink('https://www.youtube.com/embed/y4mS3RU2fdk')?.youtubeId, 'y4mS3RU2fdk');
  assert.equal(parseYoutubeLink('https://m.youtube.com/watch?v=y4mS3RU2fdk&feature=share')?.youtubeId, 'y4mS3RU2fdk');
});

test('parseYoutubeLink keeps a start time', () => {
  assert.equal(parseYoutubeLink('https://youtu.be/y4mS3RU2fdk?t=17')?.startSeconds, 17);
  assert.equal(parseYoutubeLink('https://www.youtube.com/watch?v=y4mS3RU2fdk&t=1m2s')?.startSeconds, 62);
  assert.equal(parseYoutubeLink('https://www.youtube.com/embed/y4mS3RU2fdk?start=15')?.url, 'https://www.youtube.com/watch?v=y4mS3RU2fdk&t=15s');
});

test('parseYoutubeLink rejects other sites and empty text', () => {
  assert.equal(parseYoutubeLink(''), null);
  assert.equal(parseYoutubeLink('not a link'), null);
  assert.equal(parseYoutubeLink('https://vimeo.com/123456789'), null);
  assert.equal(parseYoutubeLink('javascript:alert(1)'), null);
});

test('mergeJobVideos puts admin links first and skips duplicate trade clips', () => {
  const merged = mergeJobVideos(
    ['https://youtu.be/aaaaaaaaaaa', 'https://www.youtube.com/watch?v=y4mS3RU2fdk&t=17s'],
    [{ youtubeId: 'y4mS3RU2fdk', startSeconds: 17 }, { youtubeId: 'bbbbbbbbbbb' }],
  );
  assert.deepEqual(
    merged.map((video) => video.youtubeId),
    ['aaaaaaaaaaa', 'y4mS3RU2fdk', 'bbbbbbbbbbb'],
  );
});
