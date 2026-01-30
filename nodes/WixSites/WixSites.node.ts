import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeApiError } from 'n8n-workflow'

type WixSortOrder = 'ASC' | 'DESC'

interface WixSorting {
	fieldName: string
	order: WixSortOrder
}

interface WixCursorPaging {
	cursor?: string
	limit?: number
}

interface WixQueryBody {
	filter?: Record<string, unknown>
	sort?: WixSorting[]
	cursorPaging?: WixCursorPaging
}

interface WixSite extends IDataObject {
	id: string
	displayName: string
	name: string
	published: boolean
	premium: boolean
	createdDate: string
	updatedDate: string
	editorType: string
	viewUrl?: string
}

interface WixQueryResponse {
	sites: WixSite[]
	metadata?: {
		count: number
		cursors?: {
			next?: string
		}
	}
}

export class WixSites implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wix Sites',
		name: 'wixSites',
		icon: 'file:wix.svg',
		group: ['transform'],
		version: 1,
		description: 'Query sites from Wix using filters, sorting and paging',
		usableAsTool: true,
		defaults: { name: 'Wix Sites' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'wixApi', required: true }],
		properties: [
            {
                displayName: 'Filter (JSON)',
                name: 'filter',
                type: 'json',
                default: {},
                description: 'Filtro no formato da API do Wix'
            },
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'collection',
				placeholder: 'Add sort field',
				default: {},
				options: [
					{
						displayName: 'Field Name',
						name: 'fieldName',
						type: 'string',
						default: 'displayName'
					},
					{
						displayName: 'Order',
						name: 'order',
						type: 'options',
						options: [
							{ name: 'ASC', value: 'ASC' },
							{ name: 'DESC', value: 'DESC' }
						],
						default: 'ASC'
					}
				]
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100
				},
				default: 50,
				description: 'Max number of results to return'
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Cursor returned from a previous request'
			}
		]
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		try {
			const credentials = await this.getCredentials('wixApi')

			const filter = this.getNodeParameter('filter', 0) as Record<string, unknown>
			const sortInput = this.getNodeParameter('sort', 0, {}) as { fieldName?: string; order?: WixSortOrder }
			const limit = this.getNodeParameter('limit', 0) as number
			const cursor = this.getNodeParameter('cursor', 0) as string

			const body: WixQueryBody = {
				filter: Object.keys(filter).length > 0 ? filter : undefined,
				sort: sortInput.fieldName ? [{
					fieldName: sortInput.fieldName,
					order: sortInput.order ?? 'ASC',
				}] : undefined,
				cursorPaging: { limit, cursor: cursor || undefined }
			}

			const response = (await this.helpers.httpRequest({
				method: 'POST',
				url: 'https://www.wixapis.com/site-list/v2/sites/query',
				headers: {
					Authorization: credentials.apiKey as string,
					'wix-account-id': credentials.accountId as string,
					'Content-Type': 'application/json',
				},
				body,
				json: true,
			})) as WixQueryResponse

			return [this.helpers.returnJsonArray(response.sites)]
		} catch (error) {
            if (error instanceof NodeApiError) throw error
			throw new NodeApiError(this.getNode(), { message: error instanceof Error ? error.message : 'Unknown error' })
		}
	}
}