import {
  BottomNav,
  Content,
  IconButton,
  InlineState,
  PlusIcon,
  Screen,
  SearchIcon,
  TopBar,
  TopBarActions,
} from '../components/design-system.jsx'
import { AddListRow } from '../components/home-components.jsx'
import { AllListCard, AllListsGroup, DeleteListDialog, RenameListDialog } from '../components/list-components.jsx'

export function AllListsScreen({
  activeListMenuId,
  deleteDialogList,
  isListLoading,
  message,
  onCancelDeleteList,
  onCancelRenameList,
  onConfirmDeleteList,
  onConfirmRenameList,
  onDeleteList,
  onOpenList,
  onOpenMenu,
  onNavigate,
  onRenameList,
  onRenameDraftChange,
  onToggleListMenu,
  renameDialogList,
  renameDraft,
  session,
  shoppingLists,
}) {
  return (
    <Screen label="All lists">
      <TopBar
        actions={
          <TopBarActions>
            <IconButton label="Add list" onClick={() => onNavigate('newList')}>
              <PlusIcon />
            </IconButton>
            <IconButton label="Search lists" onClick={() => onNavigate('listSearch')}>
              <SearchIcon />
            </IconButton>
          </TopBarActions>
        }
        onMenuOpen={onOpenMenu}
        title="All lists"
      />

      <Content>
        <div className="all-lists-content">
          {message ? <p className="data-message">{message}</p> : null}

          {isListLoading ? (
            <InlineState>Loading shopping lists...</InlineState>
          ) : !session ? (
            <InlineState>Sign in to load your saved shopping lists.</InlineState>
          ) : (
            <AllListsGroup title="Your lists">
              {shoppingLists.length > 0 ? (
                shoppingLists.map((list) => (
                  <AllListCard
                    isMenuOpen={activeListMenuId === list.id}
                    list={list}
                    key={list.id}
                    onDelete={() => onDeleteList(list)}
                    onMenuToggle={() => onToggleListMenu(list.id)}
                    onOpen={onOpenList}
                    onRename={() => onRenameList(list)}
                  />
                ))
              ) : (
                <div className="shared-empty">No shopping lists yet.</div>
              )}
              <AddListRow isCard onCreate={() => onNavigate('newList')} />
            </AllListsGroup>
          )}
        </div>
      </Content>

      <BottomNav activeView="lists" onNavigate={onNavigate} />

      {renameDialogList ? (
        <RenameListDialog
          list={renameDialogList}
          name={renameDraft}
          onCancel={onCancelRenameList}
          onChange={onRenameDraftChange}
          onConfirm={onConfirmRenameList}
        />
      ) : null}

      {deleteDialogList ? (
        <DeleteListDialog
          list={deleteDialogList}
          onCancel={onCancelDeleteList}
          onConfirm={onConfirmDeleteList}
        />
      ) : null}
    </Screen>
  )
}
