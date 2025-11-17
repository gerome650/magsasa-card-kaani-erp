import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Menu, Search, Trash2, X } from "lucide-react";

interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationManagerProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: number) => void;
}

export function ConversationManager({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((convo) =>
    convo.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete !== null) {
      onDeleteConversation(conversationToDelete);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">
              {activeConversation?.title || "Conversations"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          {/* New Conversation Button */}
          <DropdownMenuItem onClick={onNewConversation} className="font-medium">
            + New Conversation
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Search Input */}
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-9"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Conversation List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-gray-500">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </div>
            ) : (
              filteredConversations.map((convo) => (
                <DropdownMenuItem
                  key={convo.id}
                  onClick={() => onSelectConversation(convo.id)}
                  className={`flex items-center justify-between group ${
                    activeConversationId === convo.id ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex-1 truncate pr-2">
                    <div className="font-medium truncate">{convo.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(convo.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(convo.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </DropdownMenuItem>
              ))
            )}
          </div>

          {searchQuery && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-xs text-gray-500">
                Showing {filteredConversations.length} of {conversations.length} conversations
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
