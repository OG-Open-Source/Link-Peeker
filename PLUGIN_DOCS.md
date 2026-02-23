# Link Peeker Plugin Documentation v1.0

Link Peeker 外掛系統允許使用者自定義特定網站的預覽行為，包括繞過安全限制、轉換 URL 格式以及調整 Iframe 許可權。

## 外掛結構 (JSON)

```json
{
	"id": "unique-plugin-id",
	"name": "Plugin Name",
	"version": "1.0.0",
	"author": "Author Name",
	"license": "MIT",
	"matches": ["regex-pattern-without-protocol"],
	"rules": {
		"headersToRemove": ["Content-Security-Policy", "X-Frame-Options"],
		"embedUrl": "https://example.com/embed/{id}",
		"idRegex": "regex-to-extract-id"
	}
}
```

### 欄位說明

| Key       | 型別   | 說明                                                                                |
| :-------- | :----- | :---------------------------------------------------------------------------------- |
| `id`      | String | 外掛唯一識別碼。                                                                    |
| `name`    | String | 外掛顯示名稱。                                                                      |
| `version` | String | 外掛版本號。                                                                        |
| `matches` | Array  | 匹配域名的正規表示式。系統固定使用 `https?://` 作為字首，您只需填寫域名及路徑部分。 |
| `rules`   | Object | 具體的處理規則。                                                                    |

### Rules 支援項

| Key               | 型別   | 說明                                                           |
| :---------------- | :----- | :------------------------------------------------------------- |
| `headersToRemove` | Array  | 要從響應頭中移除的欄位 (如 `X-Frame-Options`)。                |
| `embedUrl`        | String | 轉換後的嵌入 URL 模板。支援變數：`{id}`, `{origin}`, `{url}`。 |
| `idRegex`         | String | 用於從原始 URL 中提取 `{id}` 的正規表示式。                    |

## 匹配邏輯

系統會自動將 `matches` 中的正規表示式與當前連結進行比對。例如：`matches: [".*\\.youtube\\.com/watch.*"]` 會匹配所有 YouTube 播放頁面。

## 變數說明 (Embed URL)

- `{id}`: 透過 `idRegex` 提取的內容。
- `{origin}`: 當前網頁的 `window.location.origin`。
- `{url}`: 原始連結的完整 URL。
