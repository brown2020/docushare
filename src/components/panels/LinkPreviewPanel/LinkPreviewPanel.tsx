import { Icon } from '@/components/ui/Icon'
import { Surface } from '@/components/ui/Surface'
import { Toolbar } from '@/components/ui/Toolbar'
import { Tooltip, TooltipContentTitle, TooltipTrigger } from '@/components/ui/Tooltip/Tooltip'
// import Tooltip from '@/components/ui/Tooltip'

export type LinkPreviewPanelProps = {
  url: string
  onEdit: () => void
  onClear: () => void
}

export const LinkPreviewPanel = ({ onClear, onEdit, url }: LinkPreviewPanelProps) => {
  return (
    <Surface className="flex items-center gap-2 p-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline break-all">
        {url}
      </a>
      {/* <Toolbar.Divider /> */}
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
            <Icon name="Trash2" />
          </Toolbar.Button>
        </TooltipTrigger>
        <TooltipContentTitle title='Remove link' />
      </Tooltip>
    </Surface>
  )
}
