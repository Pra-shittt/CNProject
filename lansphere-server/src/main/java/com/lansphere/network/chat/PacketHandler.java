package com.lansphere.network.chat;

import com.lansphere.network.LanSpherePacket;

/** Receives a validated packet delivered by the TCP server worker pool. */
@FunctionalInterface
public interface PacketHandler { void handle(LanSpherePacket packet, String sourceAddress); }
