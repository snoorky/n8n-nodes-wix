import { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow'

export class WixApi implements ICredentialType {
	name = 'wixApi'
	displayName = 'Wix API'
	documentationUrl = 'https://dev.wix.com/docs/rest'
	icon: Icon = 'file:wix.svg'
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API Key de nível de conta do Wix (Account-level API key)',
		}
	]
	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: 'https://www.wixapis.com/site-list/v2/sites/query',
			body: { cursorPaging: { limit: 1 } }
		}
	}
}