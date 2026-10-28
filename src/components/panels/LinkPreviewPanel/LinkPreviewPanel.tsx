import { Icon } from '@/components/ui/Icon'
import { Surface } from '@/components/ui/Surface'
import { Toolbar } from '@/components/ui/toolbar'
import { Tooltip, TooltipContentTitle, TooltipTrigger } from '@/components/ui/Tooltip/Tooltip'
import { isSafeLinkHref } from '@/lib/links'

export type LinkPreviewPanelProps = {
  url: string
  onEdit: () => void
  onClear: () => void
}

export const LinkPreviewPanel = ({ onClear, onEdit, url }: LinkPreviewPanelProps) => {
  return (
    <Surface className="flex items-center gap-2 p-2">
      {isSafeLinkHref(url) ? (
        <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm underline break-all">
          {url}
        </a>
      ) : (
        <span className="text-sm break-all">{url}</span>
      )}
      <Tooltip>
        <TooltipTrigger>
          <Toolbar.Button onClick={onEdit}>
            <Icon name="Pen" />
          </Toolbar.Button>
        </TooltipTrigger>
        <TooltipContentTitle title='Edit link' />
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Toolbar.Button onClick={onClear}>
            <Icon name="Trash" />
          </Toolbar.Button>
        </TooltipTrigger>
        <TooltipContentTitle title='Remove link' />
      </Tooltip>
    </Surface>
  )
}
