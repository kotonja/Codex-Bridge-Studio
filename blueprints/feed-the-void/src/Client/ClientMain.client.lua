local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local controllersFolder = script.Parent:WaitForChild("Controllers")

local NotificationController = require(controllersFolder:WaitForChild("NotificationController"))
local UIController = require(controllersFolder:WaitForChild("UIController"))
local PromptController = require(controllersFolder:WaitForChild("PromptController"))

local remotes = ReplicatedStorage:WaitForChild("Remotes")

NotificationController:Init(player)
UIController:Init(player, remotes, NotificationController)
PromptController:Init(player, NotificationController)

NotificationController:Show("Welcome to FEED THE VOID!", "tutorial")
print("[FEED THE VOID] Phase 1.5 client loaded.")
