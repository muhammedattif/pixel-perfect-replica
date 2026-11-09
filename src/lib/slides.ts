export type Block = { heading?: string; items: string[] };
export type Slide = { kicker: string; title: string; subtitle?: string; blocks: Block[] };

export const slides: Slide[] = [
  {
    kicker: "Title",
    title: "Supporting 3-decimal currencies",
    subtitle: "From a 2-decimal store to minor units, without downtime",
    blocks: [],
  },
  {
    kicker: "The problem",
    title: "The problem",
    blocks: [
      {
        items: [
          "Amounts are stored as decimals, mostly django-money, at 2 decimal places.",
          "KWD, BHD, and OMR need 3 decimal places (ISO 4217).",
          "Example: `5.731` KWD was stored and returned as `5.73`.",
          "The currency table already knew this. It was only applied at the provider boundary.",
        ],
      },
    ],
  },
  {
    kicker: "Constraints",
    title: "Constraints",
    blocks: [
      {
        items: [
          "Intent, transaction, and operation tables are large and high volume.",
          "No table rewrite and no downtime.",
          "Merchants already send and receive major units (`10.50`, `5.731`).",
          "APIs and webhooks stay exactly as they are until `money_high_precision_input` is enabled for a merchant who is ready to send and receive more than 2 decimal places.",
        ],
      },
    ],
  },
  {
    kicker: "Options we considered",
    title: "Options we considered",
    blocks: [
      {
        heading: "Option 1, set aside: widen the live decimal columns from 2 to 6 places.",
        items: [
          "PostgreSQL rewrites the table under a lock. That is hours of downtime.",
          "django-money checks `decimal_places` on save, so the database and Django must change together.",
        ],
      },
      {
        heading: "Option 2, set aside: add a wider shadow column, sync it with a trigger, backfill, then rename.",
        items: [
          "This was the near-term recommendation in the assessment.",
          "It only adds decimal capacity, so integer storage would mean a second migration.",
          "After the rename there is no flag to turn it off.",
          "The trigger drop, the rename, and making the old column nullable must be one transaction, or the next insert fails.",
          "Every reader of `.amount`, including reports, would see the extra places at once.",
        ],
      },
      {
        heading: "Option 3, shipped: keep the 2-decimal columns, and add integer minor columns beside them.",
        items: [
          "One object, `MoneyValue`, holds the major amount, the minor amount, and the currency.",
          "One flag, `money_high_precision_input`, per organization or account, turns the extra decimal place on for a merchant.",
          "With the flag off, APIs and webhooks stay on the current 2-decimal values.",
          "Detail is on the next slide.",
        ],
      },
    ],
  },
  {
    kicker: "What we shipped",
    title: "What we shipped",
    blocks: [
      {
        items: [
          "New integer columns next to the existing decimals: `amount_minor` and `amount_minor_currency`.",
          "One object, `MoneyValue`, holds the major amount, the minor amount, and the currency.",
          "USD `10.50` → `1050`. KWD `5.731` → `5731`. JPY `100` → `100`.",
          "The integer always uses the currency’s real exponent.",
          "The old decimal column stays at 2 decimal places, so current readers keep working.",
          "Columns are nullable. Adding them does not rewrite the tables.",
          "Existing rows were backfilled. `10.50` USD became `1050`.",
        ],
      },
    ],
  },
  {
    kicker: "Where it lives, and the one flag",
    title: "Where it lives, and the one flag",
    blocks: [
      {
        heading: "Columns:",
        items: [
          "Parent `Intent` and `Transaction`, shared by pay-in and payout.",
          "`Operation`.",
          "`SplitData`, for the amount and the commission.",
          "Child payment and payout tables have no minor columns of their own.",
        ],
      },
      {
        heading: "Flag: `money_high_precision_input`, per organization or account.",
        items: [
          "Off: round to 2 decimal places (`5.739` KWD → `5.74`) and read the old column. APIs and webhooks stay unchanged.",
          "On: keep the currency’s places (`5.731` stays `5.731`) and read `amount_minor`.",
          "The minor columns are written on every save either way.",
          "Extra digits are rounded, not rejected.",
        ],
      },
    ],
  },
  {
    kicker: "How a value moves",
    title: "How a value moves",
    blocks: [
      {
        items: [
          "Merchant sends a major amount.",
          "The flag rounds it, or keeps the extra place.",
          "`MoneyValue` converts it with `Decimal` and half-up rounding, never float.",
          "Save writes the 2-decimal column and the minor columns.",
          "A normal save fills the minor columns in `pre_save` on `Intent`, `PaymentTransaction`, `PayoutTransaction`, `Operation`, and `SplitData`.",
          "A precise value is set with `apply_amount` or `apply_mv_on_instance` before save, and the signal leaves it as-is.",
          "`update()` and bulk writes skip the signal, so they set the minor columns themselves.",
          "Flag off reads the old column. Flag on reads the minor amount.",
        ],
      },
    ],
  },
  {
    kicker: "What we faced",
    title: "What we faced",
    blocks: [
      {
        items: [
          "Copying `.amount` from intent to transaction drops the third digit. Copy with `get_money_value()` instead.",
          "The signal would replace minor `5731` with `5730` if it always recomputed from the 2-decimal column. It now runs only when that column changed, and it skips a minor set on purpose.",
          "Reading the integer with the wrong exponent turns KWD `123.456` into `1234.56`. Conversion always uses the real exponent. Flag off does not read the integer.",
          "`int(5.731 * 1000)` in float is `5730`. Conversion uses `Decimal`.",
          "Amount and currency must be read from `MoneyValue` together.",
          "The old amount lives on the child row. The parent row is resolved to that child before it is read.",
          "Querysets that defer the minor columns, or the account used by the flag, break. Those fields have to be loaded.",
        ],
      },
    ],
  },
  {
    kicker: "Still open, and how we work now",
    title: "Still open, and how we work now",
    blocks: [
      {
        heading: "Still 2 decimal places, or float:",
        items: [
          "`usd_amount` (billing, TPV, exports, sums), revenue totals, metrics tables.",
          "OpenSearch and Datadog.",
          "Wallet, subscriptions, payment links, invoices.",
          "An embed tip can change the intent and leave the transaction unchanged.",
          "A wallet partial payment must subtract through `MoneyValue`.",
        ],
      },
      {
        heading: "From here:",
        items: [
          "Read and write through `get_money_value()`, `apply_amount`, or `apply_mv_on_instance`.",
          "The public API stays a decimal string until the flag is on for that merchant.",
          "The old amount, `usd_amount`, and revenue stay the 2-decimal copies.",
        ],
      },
    ],
  },
];
