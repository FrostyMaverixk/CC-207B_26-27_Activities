# Org Fair

Flutter app for the CICT Org Fair. Event listings are configured to load from
Contentful's Content Delivery API.

## Configure Contentful

Create a Contentful content type with the ID `fairevent` and these fields:

| Field | Contentful type |
|---|---|
| `title` | Short text |
| `orgId` | Short text |
| `startsAt` | Date and time |
| `venue` | Short text |
| `description` | Long text |
| `cancelled` | Boolean |

Publish the event entries, then create an API key and use its **Content Delivery
API access token**. The app does not use a Preview API token or a Content
Management token.

Update the ignored `cms.json` file with your Contentful space ID and delivery
token:

```json
{
  "CMS": "contentful",
  "CMS_SPACE": "your-space-id",
  "CMS_TOKEN": "your-delivery-token"
}
```

The local `cms.json` is ignored by Git. Keep your delivery token there and do
not commit it. The Content Delivery API only returns published entries. If a
token has been shared publicly, revoke it and update your local `cms.json`.

## My Shelf

The app's **My Shelf** destination includes **My Picks**, **Books**, and
**Movies**. Books search Open Library. Movies and movie details require a free
OMDb API key; provide it at runtime and keep it out of source control:

```powershell
flutter run --dart-define-from-file=cms.json --dart-define=OMDB_KEY=your-key
```

In the configured CMS, create and publish a `Pick` content type with:

| Field | Type |
|---|---|
| `title` | Short text / string |
| `kind` | `book` or `movie` |
| `externalId` | Short text / string |
| `note` | Long text |

Use the content type ID `pick` in Contentful and Sanity. In Strapi, create the
`Pick` collection type (API ID `pick`, endpoint `/api/picks`). Allow the same
public/read access as for events. Add at least two book picks and two movie
picks. Copy IDs from the Books and Movies search tabs; the detail screen
retrieves cover/poster, year, and summary from the respective public API.

## Run and test

```powershell
flutter pub get
flutter run --dart-define-from-file=cms.json --dart-define=OMDB_KEY=your-key
flutter test
flutter analyze
```

Without `cms.json` defines, the app uses built-in sample events. Contentful
returns published entries; drafts are not available through the Content
Delivery API.
