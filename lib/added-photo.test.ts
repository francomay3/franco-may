import { shipPhoto, shipPhotos, type AddedPhotoRow } from './added-photo';

function row(over: Partial<AddedPhotoRow> = {}): AddedPhotoRow {
  return {
    place_uuid: '4bbf325e-3a90-425e-b690-e1c822e219ed',
    file: 'e8a3349b-5b41-49b2-89c5-5149a4d42bbe.jpg',
    thumb:
      'https://firebasestorage.googleapis.com/v0/b/fornlamningar.firebasestorage.app/o/photos%2Fe8a3349b-5b41-49b2-89c5-5149a4d42bbe.jpg?alt=media',
    page: null,
    author: null,
    licence: null,
    licence_url: null,
    image_url:
      'https://firebasestorage.googleapis.com/v0/b/fornlamningar.firebasestorage.app/o/photos%2Fe8a3349b-5b41-49b2-89c5-5149a4d42bbe.jpg?alt=media',
    ...over,
  };
}

describe('shipPhoto', () => {
  it('keeps a pasted file as a finished URL', () => {
    const photo = shipPhoto(row());
    expect(photo).toMatchObject({
      place: '4bbf325e-3a90-425e-b690-e1c822e219ed',
      f: 'e8a3349b-5b41-49b2-89c5-5149a4d42bbe.jpg',
      src: 'https://firebasestorage.googleapis.com/v0/b/fornlamningar.firebasestorage.app/o/photos%2Fe8a3349b-5b41-49b2-89c5-5149a4d42bbe.jpg?alt=media',
    });
    expect(photo?.h).toBeUndefined();
  });

  it('splits a Commons thumbnail into the fields the phone rebuilds', () => {
    const photo = shipPhoto(
      row({
        file: 'File:Bråborg.jpg',
        thumb:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Br%C3%A5borg.jpg/960px-Br%C3%A5borg.jpg?utm_source=commons',
        image_url:
          'https://upload.wikimedia.org/wikipedia/commons/4/43/Br%C3%A5borg.jpg',
        author: 'Västgöten',
        licence: 'CC BY-SA 3.0',
        licence_url: 'https://creativecommons.org/licenses/by-sa/3.0',
        page: 'https://commons.wikimedia.org/wiki/File:Br%C3%A5borg.jpg',
      })
    );
    expect(photo).toEqual({
      place: '4bbf325e-3a90-425e-b690-e1c822e219ed',
      f: 'Br%C3%A5borg.jpg',
      h: '4/43',
      w: 960,
      by: 'Västgöten',
      lic: 'CC BY-SA 3.0',
      licurl: 'https://creativecommons.org/licenses/by-sa/3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Br%C3%A5borg.jpg',
    });
  });

  it('drops a row with no URL', () => {
    expect(
      shipPhoto(row({ thumb: null, image_url: null, file: '' }))
    ).toBeNull();
  });
});

describe('shipPhotos', () => {
  it('keeps six per place and still ships the next place', () => {
    const first = Array.from({ length: 7 }, (_, i) =>
      row({
        file: `a-${i}.jpg`,
        image_url: `https://example.test/${i}.jpg`,
        thumb: null,
      })
    );
    const second = row({
      place_uuid: '11111111-1111-1111-1111-111111111111',
      file: 'b.jpg',
      image_url: 'https://example.test/b.jpg',
      thumb: null,
    });
    const photos = shipPhotos([...first, second]);
    expect(photos.filter(p => p.place.startsWith('4b'))).toHaveLength(6);
    expect(photos.filter(p => p.place.startsWith('11'))).toHaveLength(1);
    expect(photos[0].f).toBe('a-0.jpg');
  });
});
