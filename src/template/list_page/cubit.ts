let cubitCodeBuilder = function(blocName: string, fileName: string) {
  return `
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:xdragon/utils/error_handler.dart';
import 'package:xltheme_ui/pull_down/index.dart';

part '${fileName}_state.dart';

class ${blocName}Cubit extends Cubit<${blocName}State> {
  ${blocName}Cubit() : super(${blocName}State());

  PullDownListController pullDownListController = PullDownListController();
  final pageSize = 10;

  Future<void> onBlocRequest(int page) async {
    try {
      emit(state.copy(isLoading: true, isError: false));
      // Simulate network request or data fetching
      final data = await Future.wait([]);

      emit(state.copy(isLoading: false));

      pullDownListController.finishRefresh(PullDownResponse(hasMore: data.length == pageSize, list: data));
    } catch (e, s) {
      if (!isClosed) {
        emit(state.copy(isError: true, isLoading: false));
      }
      pullDownListController.finishRefresh(PullDownResponse(hasError: true, list: []));
      handlerError(e, s);
    }
  }
}
  `;
};

let stateCodeBuilder = function(blocName: string, fileName: string) {
  return `
part of '${fileName}_cubit.dart';

class ${blocName}State extends Equatable {
  const ${blocName}State({
    this.isLoading = false,
    this.isError = false,
  });

  final bool isLoading;
  final bool isError;

  ${blocName}State copy({
    bool? isLoading,
    bool? isError,
  }) {
    return ${blocName}State(
      isLoading: isLoading ?? this.isLoading,
      isError: isError ?? this.isError,
    );
  }

  @override
  List<Object?> get props => [isLoading, isError];
}
  `;
};

let pulldownListCubitCodeBuilder = function(blocName: string, fileName: string) {
  return `
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:xdragon/utils/error_handler.dart';
import 'package:xltheme_ui/pull_down/index.dart';

part '${fileName}_state.dart';

class ${blocName}Cubit extends Cubit<${blocName}State> {
  ${blocName}Cubit({required this.vsync, this.initialIndex}) : super(${blocName}State());

  final TickerProvider vsync;
  final String? initialIndex;

  final pageSize = 10;
  final List<String> tabs = ['Tab 1', 'Tab 2', 'Tab 3'];

  late TabController tabController;
  Map<String, PullDownListController> pullDownListControllers = {};
  int initialTabIndex = 0;

  void initState() {
    if (initialIndex != null) {
      initialTabIndex = int.tryParse(initialIndex!) ?? 0;
    }
    tabController = TabController(length: tabs.length, vsync: vsync, initialIndex: initialTabIndex);

    for (var tab in tabs) {
      pullDownListControllers[tab] = PullDownListController();
    }
  }

  Future<void> onBlocRequest(int page) async {
    final pullDownListController = pullDownListControllers[tabs[tabController.index]];
    try {
      // TODO: Simulate network request or data fetching
      final data = await Future.wait([]);

      pullDownListController?.finishRefresh(PullDownResponse(hasMore: data.length == pageSize, list: data));
    } catch (e, s) {
      pullDownListController?.finishRefresh(PullDownResponse(hasError: true, list: []));
      handlerError(e, s);
    }
  }

  void callRefresh() {
    final pullDownListController = pullDownListControllers[tabs[tabController.index]];
    pullDownListController?.callRefreshByBloc((page) => onBlocRequest(page));
  }
}
  `;
};

let pulldownListStateCodeBuilder = function(blocName: string, fileName: string) {
  return `
part of '${fileName}_cubit.dart';

class ${blocName}State extends Equatable {
  const ${blocName}State({
    this.isLoading = false,
    this.isError = false,
  });
final bool isLoading;
  final bool isError;

  ${blocName}State copy({
    bool? isLoading,
    bool? isError,
  }) {
    return ${blocName}State(
      isLoading: isLoading ?? this.isLoading,
      isError: isError ?? this.isError,
    );
  }

  @override
  List<Object?> get props => [isLoading, isError];
}
  `;
};

export { cubitCodeBuilder, stateCodeBuilder, pulldownListCubitCodeBuilder, pulldownListStateCodeBuilder };